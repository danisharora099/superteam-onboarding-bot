#!/bin/bash
# Test the bot by sending messages directly via Telegram API
BOT="https://api.telegram.org/bot8193481437:AAGuAathMD7zPwnaH7Q4e24zlFMoP-ud0wg"

echo "=== Step 1: Check bot is alive ==="
curl -s "$BOT/getMe" | python3 -m json.tool

echo ""
echo "=== Step 2: Try sending a message to the main group ==="
curl -s "$BOT/sendMessage" \
  -d chat_id=-5132273750 \
  -d text="Bot is online and working!" | python3 -m json.tool

echo ""
echo "=== Step 3: Try sending a message to the intros group ==="
curl -s "$BOT/sendMessage" \
  -d chat_id=-5181815538 \
  -d text="Bot is online in intros channel!" | python3 -m json.tool
