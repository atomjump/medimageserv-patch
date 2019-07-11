; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "MedImage Server Patch"
#define MyAppShortName "MedImageServ-Patch"
#define MyAppBaseName "medimageserv-patch"
#define MyAppGitName "medimageserv-patch"
#define MyAppLCShortName "medimageserv-patch"
#define MyAppVersion "1.6.1.8"
#define MyAppPublisher "AtomJump"
#define MyAppURL "http://medimage.co.nz"
#define MyAppExeName "winstart-browser.bat"

#define MyAppIcon "medimage.ico"

#define NSSM "nssm.exe"
#define NSSM32 "nssm-x86.exe"
#define NSSM64 "nssm.exe"
#define NODE64 "node-v4.2.6-x64.msi"
#define NODE "node-v4.2.6-x64.msi"


;Change this dir depending on where you are compiling from. Leave off the trailing slash
#define STARTDIR "C:\medimage-dev-env\buildSoftwareMedImage\MedImage-Addons\medimageserv-patch"
#define DEFAULTPHOTOSDIR "C:\medimage\photos"
#define DEFAULTAPPDIR "medimage\addons\medimageserv-1-6-1"
#define MYDATETIMESTRING GetDateTimeString('dd-mm-yyyy-hh-nn-ss', '-', '-');


[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{839177C5-0FC1-4E30-BF22-39D37A10556E}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#DEFAULTAPPDIR}
DisableWelcomePage=no
DisableDirPage=no
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
;LicenseFile={#STARTDIR}\LICENSE.txt
OutputDir={#STARTDIR}
OutputBaseFilename={#MyAppShortName}Installer
SetupIconFile={#STARTDIR}\{#MyAppBaseName}\winstaller\{#MyAppIcon}
Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={#STARTDIR}\{#MyAppBaseName}\winstaller\{#MyAppIcon}
PrivilegesRequired=admin



[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"


[Files]
Source: "{#STARTDIR}\{#MyAppBaseName}\winstaller\{#MyAppIcon}"; DestDir: "{app}"; Flags: ignoreversion

Source: "{#STARTDIR}\{#MyAppBaseName}\server.js"; DestDir: "{app}\..\..\bin\"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#STARTDIR}\{#MyAppBaseName}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; NOTE: Don't use "Flags: ignoreversion" on any shared system files
;Source: "{app}\bin\server.js"; DestDir: "{app}\bin\archive-server-{#MYDATETIMESTRING}.js"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
 

; Here's an example of how you could use a start menu item for just Chrome, no batch file
;Name: "{group}\{#MyAppName}"; Filename: "{pf32}\Google\Chrome\Application\chrome.exe"; Parameters: "--app=http://localhost:5566 --user-data-dir=%APPDATA%\{#MyAppShortName}\"; IconFilename: "{app}\{#MyAppIcon}"


[Code]


[Registry]


[Run]



; postinstall launch


; Add System Service
;Filename: "{app}\{#NSSM}"; Parameters: "install {#MyAppShortName} ""{pf64}\nodejs\node.exe"" ""{app}\bin\server.js"" ""5566"""; Flags: runhidden runascurrentuser;


[UninstallRun]


; Remove all leftovers
Filename: "{sys}\rmdir"; Parameters: "-r ""{app}"""; Flags: runascurrentuser;

