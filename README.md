# Grammarify Bot

A simple Telegram bot for checking grammar, which uses the Grammarly api (free plan)

Deployed to [@grammarify_bot](https://t.me/grammarify_bot). Message the bot with `/help` for usage instructions.

## Development

Requires git and docker compose (nothing else).

1. Clone the repo
2. Create an `.env.dev` file and add `BOT_TOKEN={your bot api token}`
3. Run `./dev.sh`

-> Editing files in your working directory will sync changes into the running container

<- To add/update dependencies, use `./shell.sh` to enter the container and then run e.g. `bun install foo` inside it. Changes will be synced back to your working directory.
