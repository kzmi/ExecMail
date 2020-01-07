ExecMail
========

Thunderbird add-on that executes JavaScript written in the editing mail.


## About this Add-on

This add-on adds a menu that execute JavaScript written in the editing mail.  
You can generate a new mail with JavaScript you wrote.

To try a sample :

1. Open Compose window (edit a new message)
2. Dlete all text in the message editor (also your signature)
3. Select menu : `Options` > `ExecMail` > `Insert sample code`
4. Select menu : `Options` > `ExecMail` > `Execute`

### [Caution] (Version 1.0.*)

Version 1.0.* has a security risk.  
The execution context is not separated from the context Thunderbird uses internally.  
Thunderbird's internal objects are not protected from your script.  

Since Version 1.1.0, Javscript code is executed in sandbox. The script cannot access Thunderbird's internal objects.  
