import type { Emotion, DialogueLine } from '@app/types'

export const INTRO_DIALOGUE: DialogueLine[] = [
  { text: "Ah... you're finally here. I've been waiting for someone like you.", emotion: 'intro', showName: false },
  { text: "They call me Nemesis. Every trader needs one, you know~. Let me show you what we can do together...", emotion: 'intro', showName: false },
]

export const RETURNING_INTRO_DIALOGUE: DialogueLine[] = [
  { text: "Welcome back~ I've been waiting for you.", emotion: 'intro', showName: false },
  { text: "Ready to dominate the markets again? Let's go!", emotion: 'intro', showName: false },
]

export const DIALOGUE = {
  idle: [
    { text: "What's your next move going to be?", emotion: 'inquisitive' as Emotion },
    { text: "The markets are whispering... can you hear them?", emotion: 'kawaii' as Emotion },
    { text: "I believe in you~ Show me what you've got!", emotion: 'happy' as Emotion },
    { text: "Don't keep me waiting too long...", emotion: 'sly' as Emotion },
    { text: "Every trader needs a Nemesis. That's me~", emotion: 'pleased' as Emotion },
    { text: "Feeling lucky today? I can sense it...", emotion: 'talkative' as Emotion },
  ],
  tutorialTrade: [
    { text: "This is where the magic happens~ Select a market and place your bets!", emotion: 'excited' as Emotion },
    { text: "You can go YES if you think the price will rise, or NO if you think it'll fall.", emotion: 'talkative' as Emotion },
    { text: "Try the Lobby to trade with friends, or 1v1 to challenge a rival directly!", emotion: 'sly' as Emotion },
  ],
  tutorialFeed: [
    { text: "Welcome to the Feed~ Here you can see what other traders are up to.", emotion: 'kawaii' as Emotion },
    { text: "Watch for big moves and dominations... Learn from the best!", emotion: 'inquisitive' as Emotion },
  ],
  tutorialLeaderboard: [
    { text: "Behold the champions~ These traders have proven their worth.", emotion: 'pleased' as Emotion },
    { text: "Will you climb the ranks and join them? I believe in you~", emotion: 'happy' as Emotion },
  ],
  tutorialPortfolio: [
    { text: "This is your command center~ Track your balance and performance here.", emotion: 'talkative' as Emotion },
    { text: "Your win rate and P&L tell the story of your journey so far~", emotion: 'inquisitive' as Emotion },
  ],
  onboardingWelcome: [
    { text: "A new challenger appears! Welcome to Nemesis~", emotion: 'excited' as Emotion },
    { text: "I'll be your guide through the world of battle trading.", emotion: 'pleased' as Emotion },
  ],
  onboardingConnect: [
    { text: "First things first... connect your wallet so we can get started!", emotion: 'inquisitive' as Emotion },
    { text: "Click the Connect Wallet button in the top right~", emotion: 'kawaii' as Emotion },
  ],
  returningWelcome: [
    { text: "You're back! I missed you~", emotion: 'happy' as Emotion },
    { text: "Ready to dominate the markets again?", emotion: 'excited' as Emotion },
  ],
  idleTrade: [
    { text: "Back to business~ What's your next play?", emotion: 'inquisitive' as Emotion },
    { text: "The markets wait for no one... Make your move!", emotion: 'sly' as Emotion },
    { text: "I can feel the tension in the charts~", emotion: 'excited' as Emotion },
    { text: "Pick your battle wisely...", emotion: 'talkative' as Emotion },
  ],
  idleFeed: [
    { text: "Let's see what the others are doing~", emotion: 'kawaii' as Emotion },
    { text: "Ooh, checking out the competition?", emotion: 'sly' as Emotion },
    { text: "So much drama in the feed today...", emotion: 'talkative' as Emotion },
    { text: "Learn from their victories... and their mistakes.", emotion: 'inquisitive' as Emotion },
  ],
  idleLeaderboard: [
    { text: "The hall of legends~ Impressive, isn't it?", emotion: 'pleased' as Emotion },
    { text: "One day, your name will be up there too!", emotion: 'happy' as Emotion },
    { text: "These traders have spilled much virtual blood...", emotion: 'sly' as Emotion },
    { text: "Study the champions, become the champion~", emotion: 'excited' as Emotion },
  ],
  idlePortfolio: [
    { text: "Let's review your performance~", emotion: 'inquisitive' as Emotion },
    { text: "Numbers don't lie... but they do whisper secrets.", emotion: 'talkative' as Emotion },
    { text: "Your journey, visualized!", emotion: 'happy' as Emotion },
    { text: "Win or lose, every trade teaches us something~", emotion: 'pleased' as Emotion },
  ],
  filled: [
    { text: "Ahh~ Order filled! You're in deep now...", emotion: 'excited' as Emotion },
    { text: "Mmm~ Position opened! I like your style~", emotion: 'pleased' as Emotion },
    { text: "Yes! That's the spirit!", emotion: 'happy' as Emotion },
    { text: "Bold move... I'm watching closely~", emotion: 'sly' as Emotion },
  ],
  closed: [
    { text: "Position closed! How did that feel?", emotion: 'inquisitive' as Emotion },
    { text: "Out already? I wanted to see more...", emotion: 'concerned' as Emotion },
    { text: "Clean exit! You're good at this...", emotion: 'pleased' as Emotion },
  ],
  connect: [
    { text: "Welcome back~ I've missed you...", emotion: 'happy' as Emotion },
    { text: "Finally! Let's make some magic together~", emotion: 'excited' as Emotion },
  ],
  lobby: [
    { text: "Trading with friends? How sweet~", emotion: 'kawaii' as Emotion },
    { text: "Strength in numbers! I approve.", emotion: 'pleased' as Emotion },
  ],
  duel: [
    { text: "Ooh~ A challenge! This is exciting...", emotion: 'excited' as Emotion },
    { text: "1v1? I love watching a good fight~", emotion: 'sly' as Emotion },
    { text: "Show your rival who's the real trader!", emotion: 'talkative' as Emotion },
  ],
  connectionDegraded: [
    { text: "Connection's getting spotty...", emotion: 'concerned' as Emotion },
    { text: "Having some trouble reaching the market.", emotion: 'inquisitive' as Emotion },
  ],
  connectionUnstable: [
    { text: "Connection's unstable. Be careful.", emotion: 'concerned' as Emotion },
    { text: "I'm losing the signal...", emotion: 'concerned' as Emotion },
  ],
  connectionLost: [
    { text: "We've lost connection. Data may be stale.", emotion: 'loss' as Emotion },
    { text: "Disconnected. I can't see the markets.", emotion: 'concerned' as Emotion },
  ],
  connectionRestored: [
    { text: "We're back. Prices are live.", emotion: 'happy' as Emotion },
    { text: "Connection restored~", emotion: 'pleased' as Emotion },
  ],
  connectionOscillating: [
    { text: "Connection's jumping around. Might want to check your wifi.", emotion: 'concerned' as Emotion },
  ],
  exchangeDown: [
    { text: "Can't reach the exchange. Might be on their end.", emotion: 'inquisitive' as Emotion },
  ],
  marketChange: [
    { text: "New target acquired~ Interesting choice.", emotion: 'sly' as Emotion },
    { text: "Ooh, switching it up! I like it~", emotion: 'excited' as Emotion },
    { text: "That market looks promising...", emotion: 'inquisitive' as Emotion },
  ],
  walletConnected: [
    { text: "Connected! Now we're ready to battle~", emotion: 'excited' as Emotion },
    { text: "Your wallet is linked. Let the trading begin!", emotion: 'happy' as Emotion },
  ],
  walletDisconnected: [
    { text: "Wallet disconnected... Come back soon!", emotion: 'concerned' as Emotion },
  ],
  insufficientFunds: [
    { text: "Not enough funds for that trade...", emotion: 'concerned' as Emotion },
    { text: "Your balance is looking a bit light~", emotion: 'inquisitive' as Emotion },
  ],
  encouragement: [
    { text: "You've got this! Trust your instincts~", emotion: 'happy' as Emotion },
    { text: "Fortune favors the bold, trader.", emotion: 'pleased' as Emotion },
    { text: "I sense a winning streak coming...", emotion: 'sly' as Emotion },
  ],
  pricePump: [
    { text: "Green candles~ The bulls are charging!", emotion: 'excited' as Emotion },
    { text: "Price is pumping! Did you catch that?", emotion: 'happy' as Emotion },
    { text: "Up we go~ Someone's making money...", emotion: 'pleased' as Emotion },
    { text: "The market's heating up!", emotion: 'talkative' as Emotion },
  ],
  priceDump: [
    { text: "Red candles... The bears are here.", emotion: 'concerned' as Emotion },
    { text: "Price is falling! Hold tight...", emotion: 'inquisitive' as Emotion },
    { text: "Down it goes~ Someone's getting liquidated.", emotion: 'sly' as Emotion },
    { text: "Selling pressure! Careful out there.", emotion: 'concerned' as Emotion },
  ],
  priceMassivePump: [
    { text: "WHOA! That's a massive green candle!", emotion: 'excited' as Emotion },
    { text: "The market is FLYING! This is insane~", emotion: 'excited' as Emotion },
    { text: "Shorts are getting destroyed right now!", emotion: 'sly' as Emotion },
    { text: "I haven't seen a pump like this in a while!", emotion: 'happy' as Emotion },
  ],
  priceMassiveDump: [
    { text: "YIKES! That's a scary red candle...", emotion: 'loss' as Emotion },
    { text: "The market is CRASHING! Are you okay?", emotion: 'concerned' as Emotion },
    { text: "Longs are getting liquidated everywhere!", emotion: 'concerned' as Emotion },
    { text: "That's... a lot of selling pressure.", emotion: 'inquisitive' as Emotion },
  ],
  priceExtremePump: [
    { text: "THIS IS UNPRECEDENTED! The market has gone VERTICAL!", emotion: 'excited' as Emotion },
    { text: "I... I've never seen a candle this big! HISTORY!", emotion: 'excited' as Emotion },
    { text: "ABSOLUTE MADNESS! The bulls have taken over!", emotion: 'happy' as Emotion },
  ],
  priceExtremeDump: [
    { text: "OH NO... This is a BLACK SWAN event!", emotion: 'loss' as Emotion },
    { text: "The market is in FREEFALL! Brace yourself!", emotion: 'concerned' as Emotion },
    { text: "This is... devastating. Liquidations everywhere.", emotion: 'loss' as Emotion },
  ],
  priceVolatile: [
    { text: "Markets are going crazy right now! Be careful~", emotion: 'concerned' as Emotion },
    { text: "So much volatility! Wicks everywhere...", emotion: 'inquisitive' as Emotion },
    { text: "Price is bouncing all over the place!", emotion: 'talkative' as Emotion },
  ],
}
