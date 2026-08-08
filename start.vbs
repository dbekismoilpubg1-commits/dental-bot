Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""C:\Users\User-X\Desktop\bot\bot.js""", 0, False
WScript.Sleep 2000
WshShell.Run """C:\Users\User-X\Desktop\bot\cloudflared.exe"" tunnel --url http://localhost:3000", 0, False
