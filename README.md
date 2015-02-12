Super Chat!
=

This is a **chat webapp**, also allowing to start multiple **video conversations** and **share files** using Google Drive or direct **p2p file transfert** (private, secure and faster). Chats are divided by **rooms** and **no authentification** is required, a unique private id is simply generated and stored into the Local Storage. A **special feature** let you **take snapshots** of you or you friends (suprise mofucker) and instantly send it as a message into the chat.

###Getting started

> Windows is not supported.

- Install Meteor
<kbd>sudo curl https://install.meteor.com | sh</kbd>
- Checkout this repo 
<kbd>git clone https://github.com/RobinVivant/superchat.git</kbd>
<kbd>cd superchat</kbd>
- Launch the server
<kbd>meteor</kbd>
- Access  this url from a browser
<kbd>http://localhost:3000</kbd>

> Chrome 39 is currently recommended as it has the best support for Web RTC
> Firefox and Chrome Ice Candidates are not compatible, thus you can't share videos nor files betweens those browsers

###Technologies

> - **Meteor** : https://www.meteor.com/
Client-side and server-side realtime reactive framework, with embeded MongoDB
> - **AdapterJS** : https://github.com/Temasys/AdapterJS
Web RTC polyfills. Video sharing and p2p file transfert
> - **Google Drive API** : https://developers.google.com/drive/web/
File sharing into the chat. Each user upload files into his drive and register a public link in the chat
> - **Google Maps API** : https://developers.google.com/maps/web/
Display of chat members location on a dynamic map

###Code overview
If you want to contribute to the project


