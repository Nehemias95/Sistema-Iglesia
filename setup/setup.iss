; Script de Inno Setup para Iglesia EFESO
; Compilar con Inno Setup (https://jrsoftware.org/isinfo.php)
; Abrir este archivo .iss con Inno Setup y presionar Ctrl+F9 para compilar

#define MyAppName "Iglesia EFESO"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Iglesia EFESO"
#define MyAppURL "http://localhost:3001"
#define MyAppExeName "start.bat"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf64}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=IglesiaEFESO-Setup-{#MyAppVersion}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableWelcomePage=no
SetupLogging=yes
UninstallDisplayIcon={app}\icon.ico

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "&Crear acceso directo en el escritorio"; GroupDescription: "Accesos directos:"; Flags: checkedonce

[Files]
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\frontend\dist\*"; DestDir: "{app}\frontend\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\frontend\package.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "start.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "stop.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "post-install.js"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Detener {#MyAppName}"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\start.bat"; Description: "Iniciar {#MyAppName}"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
Filename: "taskkill"; Parameters: "/f /im node.exe"; Flags: runhidden

[Code]
var
  NodeJSDownloadPage: TDownloadWizardPage;
  PgDownloadPage: TDownloadWizardPage;
  
function IsNodeJSInstalled: Boolean;
var
  Version: String;
begin
  if RegQueryStringValue(HKLM, 'SOFTWARE\Node.js', 'Version', Version) then
    Result := True
  else if RegQueryStringValue(HKCU, 'SOFTWARE\Node.js', 'Version', Version) then
    Result := True
  else
    Result := False;
end;

function IsPostgreSQLInstalled: Boolean;
var
  Names: TArrayOfString;
  I: Integer;
begin
  Result := False;
  if RegGetSubkeyNames(HKLM, 'SOFTWARE\PostgreSQL\Installations', Names) then
  begin
    for I := 0 to GetArrayLength(Names) - 1 do
    begin
      if Names[I] <> '' then
      begin
        Result := True;
        Exit;
      end;
    end;
  end;
end;

procedure InstallNodeJS;
var
  ResultCode: Integer;
begin
  NodeJSDownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), 'Descargando Node.js...', nil);
  NodeJSDownloadPage.Show;
  NodeJSDownloadPage.Clear;
  try
    NodeJSDownloadPage.Add('https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi', 'node-v20.18.0-x64.msi', '');
    NodeJSDownloadPage.Download;
  finally
    NodeJSDownloadPage.Hide;
  end;
  
  if Exec(ExpandConstant('{tmp}\node-v20.18.0-x64.msi'), '/quiet /norestart', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
  begin
    if ResultCode <> 0 then
      MsgBox('Error al instalar Node.js (código: ' + IntToStr(ResultCode) + ').' + #13#10 +
             'Puede instalarlo manualmente desde https://nodejs.org', mbError, MB_OK);
  end;
end;

procedure InstallPostgreSQL;
var
  ResultCode: Integer;
begin
  PgDownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), 'Descargando PostgreSQL...', nil);
  PgDownloadPage.Show;
  PgDownloadPage.Clear;
  try
    PgDownloadPage.Add('https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe',
      'postgresql-16.4-1-windows-x64.exe', '');
    PgDownloadPage.Download;
  finally
    PgDownloadPage.Hide;
  end;

  if Exec(ExpandConstant('{tmp}\postgresql-16.4-1-windows-x64.exe'),
    '--unattendedmodeui minimal --mode unattended --superpassword postgres --servicename PostgreSQL --serverport 5432',
    '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
  begin
    if ResultCode <> 0 then
      MsgBox('Error al instalar PostgreSQL (código: ' + IntToStr(ResultCode) + ').' + #13#10 +
             'Puede instalarlo manualmente desde https://www.postgresql.org/download/windows/', mbError, MB_OK);
  end;
end;

procedure RunPostInstall;
var
  ResultCode: Integer;
  NodePath: String;
  Output: String;
begin
  if Exec(ExpandConstant('{cmd}'), '/c ""node" "{app}\post-install.js""', '{app}',
    SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if ResultCode <> 0 then
      MsgBox('Error en la configuración inicial (código: ' + IntToStr(ResultCode) + ').' + #13#10 +
             'Puede ejecutar manualmente: node post-install.js', mbError, MB_OK);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if not IsNodeJSInstalled then
      InstallNodeJS;

    if not IsPostgreSQLInstalled then
      InstallPostgreSQL;

    RunPostInstall;
  end;
end;
