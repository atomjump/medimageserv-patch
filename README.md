# medimageserv-patch
An add-on patch template for the MedImage Server



There are two branches of this project:

master   			:  This is for the 'cloud' version (>= 1.8.6) and ver >= 2.0.0 with the upgraded surrounding NodeJS 14
summit-ver-1-8-5  	:  This is for the 1st edition of MedImage 1.x.x which uses NodeJS 4

You can safely switch over to the new branch, retrieve it, and build it for Windows.

Remember to sign Windows versions after being built.


## When making a new version:

1. You should copy over the new 'server.js' if it involves this file
2. Update the version number in package.json
3. Update the version number in medimage-installer.json
4. Update the 2x version numbers in winstaller/medimageserv-patch.iss (change both MyAppVersion and DEFAULTAPPDIR)
5. Update the 2x version numbers in winstaller/medimageserv-patch32.iss (change both MyAppVersion and DEFAULTAPPDIR)
