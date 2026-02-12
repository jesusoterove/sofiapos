# Send raw data to a Windows printer via Win32 API.
# Usage: powershell -ExecutionPolicy Bypass -File print-raw.ps1 <printerName> <dataFilePath>
#   printerName  - Name of the printer (e.g. "POS-80")
#   dataFilePath - Path to file containing raw bytes to send

param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$DataFilePath
)

if (-not (Test-Path -LiteralPath $DataFilePath)) {
  Write-Error "Data file not found: $DataFilePath"
  exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($DataFilePath)
if ($bytes.Length -eq 0) {
  Write-Error "Data file is empty"
  exit 1
}

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public struct DOC_INFO_1 {
    public string pDocName;
    public string pOutputFile;
    public string pDatatype;
  }

  [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOC_INFO_1 pDocInfo);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBuf, int cbBuf, out int pcWritten);
}
"@

$hPrinter = [IntPtr]::Zero
try {
  if (-not [RawPrinter]::OpenPrinter($PrinterName, [ref]$hPrinter, [IntPtr]::Zero)) {
    $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Error "OpenPrinter failed: $err"
    exit 1
  }

  # Try datatypes: RAW first (standard), then empty (some drivers reject RAW with 1804)
  $datatypes = @("RAW", "")
  $started = $false
  foreach ($datatype in $datatypes) {
    $docInfo = New-Object RawPrinter+DOC_INFO_1
    $docInfo.pDocName = "SofiaPOS Raw"
    $docInfo.pOutputFile = $null
    $docInfo.pDatatype = $datatype

    if ([RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$docInfo)) {
      $started = $true
      break
    }
    $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    if ($err -eq 1804 -and $datatype -eq "RAW") {
      continue
    }
    Write-Error "StartDocPrinter failed: $err (datatype='$datatype')"
    exit 1
  }
  if (-not $started) {
    Write-Error "StartDocPrinter failed with all datatypes"
    exit 1
  }

  try {
    if (-not [RawPrinter]::StartPagePrinter($hPrinter)) {
      $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
      Write-Error "StartPagePrinter failed: $err"
      exit 1
    }

    try {
      $pBuf = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
      try {
        [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $pBuf, $bytes.Length)
        $written = 0
        if (-not [RawPrinter]::WritePrinter($hPrinter, $pBuf, $bytes.Length, [ref]$written)) {
          $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
          Write-Error "WritePrinter failed: $err"
          exit 1
        }
        if ($written -ne $bytes.Length) {
          Write-Error "WritePrinter wrote $written of $($bytes.Length) bytes"
          exit 1
        }
      } finally {
        [System.Runtime.InteropServices.Marshal]::FreeHGlobal($pBuf)
      }
    } finally {
      [RawPrinter]::EndPagePrinter($hPrinter) | Out-Null
    }
  } finally {
    [RawPrinter]::EndDocPrinter($hPrinter) | Out-Null
  }
} finally {
  if ($hPrinter -ne [IntPtr]::Zero) {
    [RawPrinter]::ClosePrinter($hPrinter) | Out-Null
  }
}

exit 0
