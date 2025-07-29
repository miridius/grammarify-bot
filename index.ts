import { correct, Grammarly } from '@stewartmcgown/grammarly-api';
import { type Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Message, ParseMode, Update } from 'telegraf/types';

const grammarly = new Grammarly();

const getOrThrow = (envVar: string): string => {
  const value = Bun.env[envVar];
  if (!value) throw new Error(`${envVar} environment variable is required`);
  return value;
};

const bot = new Telegraf(getOrThrow('BOT_TOKEN'));

const helpMsg = `This bot uses the [grammarly](https://www.grammarly.com/grammar-check) free api, thanks to [@stewartmcgown/grammarly-api](https://www.npmjs.com/package/@stewartmcgown/grammarly-api)

There is only one command: ${'`'}/check {text}${'`'}, which will return a list of suggestions (if any).

Or just talk to it normally (or add it to a group and give it access to messages), and it will reply whenever it sees issues.

Source is on [GitHub](https://github.com/miridius/grammarify-bot). Issues/PRs welcome.`;

// helper fn because ctx.reply doesn't properly reply, and we never want to unfurl links.
const reply = (
  ctx: Context<Update.MessageUpdate<Message.TextMessage>>,
  text: string,
  parse_mode?: ParseMode,
) =>
  ctx.reply(text, {
    parse_mode,
    link_preview_options: { is_disabled: true },
    reply_parameters: { message_id: ctx.msgId },
    disable_notification: true,
  });

bot.start((ctx) =>
  reply(
    ctx,
    `*Welcome!*

${helpMsg}

_Type /help to see these instructions again._`,
    'Markdown',
  ),
);

bot.help((ctx) => reply(ctx, helpMsg, 'Markdown'));

const corrections = async (text: string) => {
  // if (text.includes('your') || text.includes('quiet')) {
  const results = await grammarly.analyse(text);
  console.log(results);
  results.alerts = results.alerts.filter(
    (r) => !r.title?.startsWith('Capitalization'),
  );
  const issues = results.alerts.filter(
    (r) =>
      r.impact === 'critical' && !['Style', 'Punctuation'].includes(r.group),
  );
  if (issues.length) {
    return [
      ...issues.map(
        (r) =>
          `• ${r.title}: <b>${r.highlightText}</b> ${
            r.replacements.length
              ? `-> <b>${r.replacements.join('</b> or <b>')}</b>`
              : ''
          }`,
      ),
      '\n<i>Fixed (I hope)</i>:\n<blockquote expandable>' +
        Bun.escapeHTML(correct(results).corrected!) +
        '</blockquote>',
    ].join('\n');
  }
  // }
};

const thumbsUp = '<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>';

bot.command('check', async (ctx) => {
  const text = ctx.text.replace(/^[^ ]+\w+/, '').trim();
  if (text.length === 0) return;
  try {
    reply(ctx, (await corrections(text)) || thumbsUp, 'HTML');
  } catch (error) {
    console.error('error checking', text, error);
    reply(ctx, 'oops, you broke me. pls check logs');
  }
});

bot.on(message('text'), async (ctx) => {
  try {
    const replyText = await corrections(ctx.text);
    if (replyText) reply(ctx, replyText, 'HTML');
  } catch (error) {
    console.error('error checking', ctx.text, error);
  }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
