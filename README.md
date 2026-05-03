# MemBMCBot 🤖

### A simple Discord bot written in JavaScript that allows you to communicate with your server's BMC directly from Discord.

> [!CAUTION]
> **PLEASE NOTE:** I am not responsible for any problems and risks when you use this, as I am not an expert in programming and have used AI tools such as Gemini to assist me making this! This is just a hobby project; you are completely responsible when using this for your own systems.

<img width="580" height="234" alt="Fan and Power Status" src="https://github.com/user-attachments/assets/b8dd29d7-86f4-41d3-bd02-d2728c8e0f0d" />

---

## 📖 Background
I got my hands on a **Supermicro X11SCA-F** from a friend, which featured a Board Management Controller (BMC) / IPMI (Intelligent Platform Management Interface). This allows for full remote management without being physically present. 

After a while of using the IPMI, I wanted an easier and more convenient way to remotely control some actions of my workstation without having to log into that page to do so. This bot aims to do exactly that as it has features such as:
* Power Control and status
* Fan control and status
* View all available sensors on the system

I don't have anything else as this aims to be a simple way to control those features from Discord to the BMC. To do this, we are using `ipmitool` that will send the raw commands to the BMC. I'm not too sure if this works on other board providers as I can only test and use this on my X11SCA-F, but considering it uses `ipmitool`, it should work with some modifications or out of the box.

---

## ✨ Features

### 🌡️ Sensors
View all available active sensors on the system (Temperatures, Voltages, etc.).
<img width="1007" height="444" alt="image" src="https://github.com/user-attachments/assets/b2f31f95-34dc-4f63-b44e-98191dfab948" />

### 🔌 Power Control
Manage chassis power state and view current status.
<img width="671" alt="Power Control Screenshot" src="https://github.com/user-attachments/assets/c868365c-9531-47ea-ba7c-313eebc4af13" />

### 🌀 Fan Control
Switch between fan profiles and check current fan mode.
<img width="701" alt="Fan Control Screenshot" src="https://github.com/user-attachments/assets/c2573ee1-3fdd-4932-b6a9-d509a14b5128" />

---

## 🛠️ Requirements & Setup

To set up the bot, you will need:
* **Discord:** Bot Token, Guild ID, Client ID.
* **BMC:** IP Address, Username, Password.
* **Permissions:** Whitelisted User IDs and Channel IDs.

> [!TIP]
> I strongly recommend making a new user account on the IPMI for the bot, as the configuration file stores credentials in plain text (again I know this isn't great but I'm not really a programmer and I don't know much, so please forgive me on this!).

### Installation

1. Create a `.env` file in the root directory.
2. Add the following structure:
```env
DISCORD_TOKEN=TOKEN_GOES_HERE
GUILD_ID=GUILD_ID_GOES_HERE
CLIENT_ID=CLIENT_ID_GOES_HERE
BMC_IP=BMC_IP_GOES_HERE
BMC_USER=BMC_USERNAME_GOES_HERE
BMC_PASS=BMC_PASSWORD_GOES_HERE
WHITELISTED_USERS=ID1,ID2
WHITELISTED_CHANNELS=ID1,ID2
```
> Note: Separate multiple IDs in the whitelist with commas. Use user/channel IDs for this.
---

## ⌨️ Commands
Commands include:
* **`/fans`** — Control fan profiles and check status.
* **`/power`** — Power on/off/reset and check power status.
* **`/sensors`** — Display real-time hardware telemetry.

---

## 🤝 Contributing
Once again I have used Gemini to make this as I am not really a good programmer but wanted something to work for my purposes, so use this at your own risk!

I will probably maintain this in the future if my conditions change, but feel free to improve the code and make it more secure and robust. 

* I **will** accept Pull Requests.
* I will **NOT** be fixing any issues; please send a Pull Request with your fixes for this!
