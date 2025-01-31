# TeaFi Automates Send Transaction

This bot will automatically send transactions to earn sugar cubes.

## Bot Features

- Auttomatically Send Transactions
- Support Proxy
- Support Multiple Accounts

# Prerequisites

- Register your wallet in TeaFi Website: [Click Here!](https://app.tea-fi.com/?ref=ousfjh)
- Ensure you have a POL balance in polygon/matic network (Atlest 3-5$ Worth)
- Make sure you have Node.js installed on your machine
- `wallets.txt` file containing private_key
- `proxy.txt` file containing your proxy lists (Optional)

## Installation

1. Clone the repository:

```
git clone https://github.com/rinkashimee/teafi-bot.git
```

```
cd teafi-bot
```

2. Install the required dependencies:

```
npm install
```

3. Input your private_key in `wallets.txt` file, one user per line:

```
nano wallets.txt
```

4. Optional, you can use proxy:

- Input your proxy lists in `proxy.txt` file, Format `http://username:password@ip:port` || `socks5://username:password@ip:port`

```
nano proxy.txt
```

5. Add screen:

```
screen -S teafi-bot
```

6. Run the script:

```
npm run start
```

7. Detach Screen:

```
press ctrl a + d
```

## License: MIT

This project uses the MIT License, details of which can be found in the LICENSE file.
