' Inicia o vigia da Plataforma de Rateio de forma OCULTA (sem abrir janela),
' automaticamente quando o Windows liga. O que ele faz está registrado em
' "vigia_log.txt", dentro da pasta dtel-plataforma-rateio, caso precise checar.
Set objShell = CreateObject("WScript.Shell")
pasta = "C:\Users\user\Downloads\dtel-plataforma-rateio"
objShell.CurrentDirectory = pasta
objShell.Run "cmd /c cd /d """ & pasta & """ && node vigiar_e_publicar.js", 0, False
