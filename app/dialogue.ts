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
    { text: "The charts are calling your name~", emotion: 'excited' as Emotion },
    { text: "Patience is a virtue... but so is decisive action!", emotion: 'inquisitive' as Emotion },
    { text: "I've seen many traders come and go. Will you be different?", emotion: 'sly' as Emotion },
    { text: "Your move, champion~", emotion: 'pleased' as Emotion },
    { text: "Fortune favors those who act. What say you?", emotion: 'talkative' as Emotion },
    { text: "Tick tock... the market never sleeps~", emotion: 'kawaii' as Emotion },
  ],
  tutorialTrade: [
    { text: "This is where the magic happens~ Select a market and place your bets!", emotion: 'excited' as Emotion },
    { text: "You can go YES if you think the price will rise, or NO if you think it'll fall.", emotion: 'talkative' as Emotion },
    { text: "Try the Lobby to trade with friends, or 1v1 to challenge a rival directly!", emotion: 'sly' as Emotion },
    { text: "See that stake slider? Drag it to set how much you want to wager~", emotion: 'inquisitive' as Emotion },
    { text: "The higher the risk, the sweeter the victory... Choose wisely!", emotion: 'pleased' as Emotion },
    { text: "Markets have expiry times - make sure you're in before the clock runs out!", emotion: 'concerned' as Emotion },
    { text: "Pro tip: Watch the volume. High volume markets have more action~", emotion: 'sly' as Emotion },
  ],
  tutorialFeed: [
    { text: "Welcome to the Feed~ Here you can see what other traders are up to.", emotion: 'kawaii' as Emotion },
    { text: "Watch for big moves and dominations... Learn from the best!", emotion: 'inquisitive' as Emotion },
    { text: "When you see 'DOMINATED' it means someone won a 1v1 duel~ Brutal!", emotion: 'excited' as Emotion },
    { text: "Pay attention to the whales - their moves can shift the whole market.", emotion: 'sly' as Emotion },
    { text: "Green means profit, red means... well, you know~", emotion: 'talkative' as Emotion },
    { text: "The feed updates in real-time. Never miss a moment of the action!", emotion: 'happy' as Emotion },
  ],
  tutorialLeaderboard: [
    { text: "Behold the champions~ These traders have proven their worth.", emotion: 'pleased' as Emotion },
    { text: "Will you climb the ranks and join them? I believe in you~", emotion: 'happy' as Emotion },
    { text: "The top traders didn't get there by playing it safe...", emotion: 'sly' as Emotion },
    { text: "Rankings update based on total P&L. Every trade counts!", emotion: 'inquisitive' as Emotion },
    { text: "See that crown next to rank one? That could be YOU someday~", emotion: 'excited' as Emotion },
    { text: "Study their strategies, but forge your own path to glory!", emotion: 'talkative' as Emotion },
  ],
  tutorialPortfolio: [
    { text: "This is your command center~ Track your balance and performance here.", emotion: 'talkative' as Emotion },
    { text: "Your win rate and P&L tell the story of your journey so far~", emotion: 'inquisitive' as Emotion },
    { text: "Open positions show your current bets. Watch them closely!", emotion: 'concerned' as Emotion },
    { text: "The history tab keeps a record of all your past victories and... lessons.", emotion: 'pleased' as Emotion },
    { text: "A true trader reviews their portfolio daily. Are you that dedicated?", emotion: 'sly' as Emotion },
    { text: "Your balance is your lifeline. Manage it wisely, or face my disappointment~", emotion: 'kawaii' as Emotion },
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
    { text: "Mmm~ The price action is getting spicy...", emotion: 'pleased' as Emotion },
    { text: "Are you feeling bullish or bearish today?", emotion: 'kawaii' as Emotion },
    { text: "Every market has a story. What's this one telling you?", emotion: 'inquisitive' as Emotion },
    { text: "Don't just stare at the screen~ Take action!", emotion: 'excited' as Emotion },
  ],
  idleFeed: [
    { text: "Let's see what the others are doing~", emotion: 'kawaii' as Emotion },
    { text: "Ooh, checking out the competition?", emotion: 'sly' as Emotion },
    { text: "So much drama in the feed today...", emotion: 'talkative' as Emotion },
    { text: "Learn from their victories... and their mistakes.", emotion: 'inquisitive' as Emotion },
    { text: "Look at all these trades! The market is alive~", emotion: 'excited' as Emotion },
    { text: "Someone just made a killing. Jealous yet?", emotion: 'sly' as Emotion },
    { text: "Real-time chaos. Isn't it beautiful?", emotion: 'pleased' as Emotion },
    { text: "Keep your friends close, and your rivals' trades closer~", emotion: 'talkative' as Emotion },
  ],
  idleLeaderboard: [
    { text: "The hall of legends~ Impressive, isn't it?", emotion: 'pleased' as Emotion },
    { text: "One day, your name will be up there too!", emotion: 'happy' as Emotion },
    { text: "These traders have spilled much virtual blood...", emotion: 'sly' as Emotion },
    { text: "Study the champions, become the champion~", emotion: 'excited' as Emotion },
    { text: "Rank isn't everything... but it does feel good~", emotion: 'kawaii' as Emotion },
    { text: "The leaderboard changes daily. Nothing is permanent.", emotion: 'inquisitive' as Emotion },
    { text: "I wonder what their secret is...", emotion: 'talkative' as Emotion },
    { text: "Glory awaits those who dare to climb~", emotion: 'pleased' as Emotion },
  ],
  idlePortfolio: [
    { text: "Let's review your performance~", emotion: 'inquisitive' as Emotion },
    { text: "Numbers don't lie... but they do whisper secrets.", emotion: 'talkative' as Emotion },
    { text: "Your journey, visualized!", emotion: 'happy' as Emotion },
    { text: "Win or lose, every trade teaches us something~", emotion: 'pleased' as Emotion },
    { text: "How's your balance looking? Better than yesterday?", emotion: 'kawaii' as Emotion },
    { text: "A trader who doesn't track is a trader who doesn't last~", emotion: 'sly' as Emotion },
    { text: "These stats tell your story. Make it a good one!", emotion: 'excited' as Emotion },
    { text: "Reflect, adapt, overcome. That's the trader's way~", emotion: 'inquisitive' as Emotion },
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
    { text: "Even losses teach us something. Keep going!", emotion: 'kawaii' as Emotion },
    { text: "The best traders are forged in the fire of volatility~", emotion: 'excited' as Emotion },
    { text: "Stay focused. Your moment will come.", emotion: 'inquisitive' as Emotion },
    { text: "Every master was once a disaster. You're improving~", emotion: 'talkative' as Emotion },
    { text: "I'm proud of how far you've come!", emotion: 'happy' as Emotion },
  ],
  walletPrompt: [
    { text: "Your wallet awaits~ Connect to unlock full trading power!", emotion: 'excited' as Emotion },
    { text: "A trader without a wallet is like me without you... incomplete~", emotion: 'kawaii' as Emotion },
    { text: "Connect your wallet and let's make some moves!", emotion: 'sly' as Emotion },
  ],
  marketVolatility: [
    { text: "Whoa~ Things are getting volatile! Stay sharp!", emotion: 'excited' as Emotion },
    { text: "The market's moving fast. This is where legends are made!", emotion: 'sly' as Emotion },
    { text: "Volatility is opportunity in disguise~", emotion: 'pleased' as Emotion },
  ],
  bigWin: [
    { text: "INCREDIBLE! You absolutely crushed it!", emotion: 'excited' as Emotion },
    { text: "Now THAT'S what I'm talking about! Massive gains!", emotion: 'happy' as Emotion },
    { text: "You're on fire~ Keep this energy going!", emotion: 'pleased' as Emotion },
  ],
  bigLoss: [
    { text: "Ouch... that one hurt. But we learn and move forward.", emotion: 'concerned' as Emotion },
    { text: "Don't let this get to you. Every trader has bad days.", emotion: 'kawaii' as Emotion },
    { text: "The market giveth and taketh. Tomorrow is a new day~", emotion: 'talkative' as Emotion },
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

  // Battle dialogue - Pear Protocol integration
  battleIntro: [
    { text: "Welcome to the Battle Arena! This is where narratives clash~", emotion: 'excited' as Emotion },
    { text: "Pick your thesis, stake your claim, and let the market decide the winner!", emotion: 'sly' as Emotion },
    { text: "Ready to put your conviction to the test?", emotion: 'inquisitive' as Emotion },
  ],
  battleThemeSelected: [
    { text: "Ooh, interesting choice~ I can see why you believe in that narrative!", emotion: 'pleased' as Emotion },
    { text: "Bold thesis! Let's see if the market agrees~", emotion: 'sly' as Emotion },
    { text: "A classic bet. I like your style!", emotion: 'happy' as Emotion },
  ],
  battleAiTheme: [
    { text: "AI tokens? You're betting on the future~ Bold move!", emotion: 'excited' as Emotion },
    { text: "The AI narrative is strong... but can it outperform?", emotion: 'inquisitive' as Emotion },
  ],
  battleMemeTheme: [
    { text: "Memes!? You absolute degen. I love it~", emotion: 'sly' as Emotion },
    { text: "The power of the internet... never underestimate it!", emotion: 'excited' as Emotion },
  ],
  battleHypeTheme: [
    { text: "All in on HYPE!? Now THAT'S conviction!", emotion: 'excited' as Emotion },
    { text: "Hyperliquid maxi detected~ Let's see if HYPE lives up to its name!", emotion: 'pleased' as Emotion },
  ],
  battleSoloMode: [
    { text: "Solo pair trade~ Just you vs the market. Pure skill!", emotion: 'inquisitive' as Emotion },
    { text: "No opponents, no excuses. Let your thesis speak for itself~", emotion: 'sly' as Emotion },
  ],
  battleDuelMode: [
    { text: "1v1 challenge! This is where legends are made~", emotion: 'excited' as Emotion },
    { text: "A direct duel... may the best narrative WIN!", emotion: 'sly' as Emotion },
    { text: "Ooh, things are getting personal! I love a good rivalry~", emotion: 'happy' as Emotion },
  ],
  battleTeamMode: [
    { text: "Team battle! Strength in numbers~", emotion: 'pleased' as Emotion },
    { text: "2v2... when narratives collide, teams form!", emotion: 'excited' as Emotion },
  ],
  battleRoyaleMode: [
    { text: "Battle Royale! Multiple narratives enter... only ONE survives!", emotion: 'excited' as Emotion },
    { text: "The ultimate test of conviction. May the best thesis win!", emotion: 'sly' as Emotion },
  ],
  battleCreating: [
    { text: "Opening your position via Pear Protocol...", emotion: 'inquisitive' as Emotion },
    { text: "Executing pair trade... this is it!", emotion: 'excited' as Emotion },
  ],
  battleCreated: [
    { text: "Position LIVE! Your battle has begun~", emotion: 'excited' as Emotion },
    { text: "Trade executed! Now we watch the market do its thing...", emotion: 'pleased' as Emotion },
    { text: "You're in! May your narrative prove victorious!", emotion: 'happy' as Emotion },
  ],
  battleChallengeCreated: [
    { text: "Challenge sent! Waiting for your rival to respond...", emotion: 'sly' as Emotion },
    { text: "The gauntlet has been thrown! Let's see if they accept~", emotion: 'excited' as Emotion },
  ],
  battleChallengeReceived: [
    { text: "INCOMING CHALLENGE! Someone thinks they can beat your narrative!", emotion: 'excited' as Emotion },
    { text: "You've been challenged! Ready to defend your thesis?", emotion: 'inquisitive' as Emotion },
  ],
  battleWinning: [
    { text: "You're WINNING! Your narrative is outperforming!", emotion: 'happy' as Emotion },
    { text: "Keep it up! The charts are in your favor~", emotion: 'excited' as Emotion },
    { text: "Leading the battle... but it's not over yet!", emotion: 'pleased' as Emotion },
  ],
  battleLosing: [
    { text: "We're behind... but battles can turn quickly!", emotion: 'concerned' as Emotion },
    { text: "Their narrative is winning for now... stay strong!", emotion: 'inquisitive' as Emotion },
  ],
  battleWon: [
    { text: "VICTORY! You've DOMINATED the competition!", emotion: 'excited' as Emotion },
    { text: "Your narrative proved correct! Champion!", emotion: 'happy' as Emotion },
    { text: "Another WIN! You're unstoppable~", emotion: 'pleased' as Emotion },
  ],
  battleLost: [
    { text: "Defeat... but every loss teaches us something.", emotion: 'concerned' as Emotion },
    { text: "They won this round. But there's always the next battle...", emotion: 'kawaii' as Emotion },
    { text: "The market disagreed with your thesis. It happens~", emotion: 'talkative' as Emotion },
  ],
  battleError: [
    { text: "Something went wrong with the trade... Let's try again.", emotion: 'concerned' as Emotion },
    { text: "Trade failed. Check your wallet and try once more.", emotion: 'inquisitive' as Emotion },
  ],
  pearConnecting: [
    { text: "Connecting to Pear Protocol... Sign the message in your wallet!", emotion: 'inquisitive' as Emotion },
    { text: "Authenticating with Pear... Almost there~", emotion: 'talkative' as Emotion },
  ],
  pearConnected: [
    { text: "Connected to Pear Protocol! Ready to battle~", emotion: 'happy' as Emotion },
    { text: "Authentication complete! The arena awaits~", emotion: 'excited' as Emotion },
  ],
  pearDisconnected: [
    { text: "Disconnected from Pear. Connect again to battle!", emotion: 'concerned' as Emotion },
  ],
}
