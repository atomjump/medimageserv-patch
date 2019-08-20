; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "MedImage Server Patch"
#define MyAppShortName "MedImageServ-Patch32"
#define MyAppBaseName "medimageserv-patch"
#define MyAppGitName "medimageserv-patch"
#define MyAppLCShortName "medimageserv-patch32"
#define MyAppVersion "1.6.2"
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
#define DEFAULTAPPDIR "medimage\addons\medimageserv-patch-1-6-2"
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
Source: "{#STARTDIR}\{#MyAppBaseName}\server.js"; DestDir: "{app}\..\..\bin\"; BeforeInstall: BeforeMyProgInstall(); AfterInstall: DeinitializeSetup(); Flags: sharedfile ignoreversion uninsneveruninstall overwritereadonly
Source: "{#STARTDIR}\{#MyAppBaseName}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; NOTE: Don't use "Flags: ignoreversion" on any shared system files


[Icons]
 

; Here's an example of how you could use a start menu item for just Chrome, no batch file
;Name: "{group}\{#MyAppName}"; Filename: "{pf32}\Google\Chrome\Application\chrome.exe"; Parameters: "--app=http://localhost:5566 --user-data-dir=%APPDATA%\{#MyAppShortName}\"; IconFilename: "{app}\{#MyAppIcon}"


[Code]



procedure BeforeMyProgInstall();
var
  ResultCode: Integer;
begin
  //Stop any existing services
  Exec(ExpandConstant('{sys}\net.exe'), ExpandConstant('stop MedImage'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\net.exe'), ExpandConstant('stop medimage'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  
  //Archive the current server file
  if FileCopy(
         ExpandConstant('{app}\..\..\bin\server.js'), ExpandConstant('{app}\..\..\bin\archived-server-{#MYDATETIMESTRING}.js'), False) then
    begin
      Log('Old server archived.');
    end
      else
    begin
      Log('Failed to archive old server.');
    end;  

  
end;

procedure DeinitializeSetup();
var
  ResultCode: Integer;
begin
  //Restart any existing services stopped in the BeforeMyProgInstall
  Exec(ExpandConstant('{sys}\net.exe'), ExpandConstant('start MedImage'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\net.exe'), ExpandConstant('start medimage'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;


[Registry]


[Run]



; postinstall launch


[UninstallRun]


; Remove all leftovers
Filename: "{sys}\rmdir"; Parameters: "-r ""{app}"""; Flags: runascurrentuser;
