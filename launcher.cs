using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class DisasterIntelLauncher
{
    static Process backendProc;
    static Process frontendProc;

    static void Main(string[] args)
    {
        Console.Title = "DisasterIntel Launcher";
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(@"
  ╔══════════════════════════════════════════════╗
  ║     🌍 DisasterIntel Platform Launcher       ║
  ║     Real-Time Disaster Intelligence          ║
  ╚══════════════════════════════════════════════╝
");
        Console.ResetColor();

        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string projectDir = baseDir;
        if (!Directory.Exists(Path.Combine(projectDir, "backend")))
        {
            projectDir = Directory.GetCurrentDirectory();
        }
        if (!Directory.Exists(Path.Combine(projectDir, "backend")))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("ERROR: Cannot find 'backend' folder.");
            Console.WriteLine("Place DisasterIntel.exe in the project root (next to backend/ and frontend/ folders).");
            Console.ResetColor();
            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
            return;
        }

        string backendDir = Path.Combine(projectDir, "backend");
        string frontendDir = Path.Combine(projectDir, "frontend");

        // Use specific Windows executables
        string nodePath = FindExecutable("node.exe");
        string npmPath = FindExecutable("npm.cmd");

        if (nodePath == null || npmPath == null)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("ERROR: Node.js or npm not found. Please install Node.js from https://nodejs.org");
            Console.ResetColor();
            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
            return;
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("  ✓ Node.js found: " + nodePath);
        Console.WriteLine("  ✓ NPM found: " + npmPath);
        Console.ResetColor();

        Console.CancelKeyPress += (s, e) =>
        {
            e.Cancel = true;
            Shutdown();
        };

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("\n  ▸ Starting Backend (port 5000)...");
        Console.ResetColor();

        backendProc = StartProcess(nodePath, "src/server.js", backendDir);
        Thread.Sleep(2000);

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("  ▸ Starting Frontend (port 3000)...");
        Console.ResetColor();

        frontendProc = StartProcess(npmPath, "run dev", frontendDir);
        
        // Wait longer for Next.js to compile
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("  ▸ Waiting 8 seconds for Next.js development server to boot...");
        Console.ResetColor();
        Thread.Sleep(8000);

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("\n  🌐 Opening browser at http://localhost:3000 ...\n");
        Console.ResetColor();

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:3000",
                UseShellExecute = true
            });
        }
        catch { }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("  ════════════════════════════════════════════");
        Console.WriteLine("  ✅ DisasterIntel is running!");
        Console.WriteLine("  ");
        Console.WriteLine("     Backend:  http://localhost:5000");
        Console.WriteLine("     Frontend: http://localhost:3000");
        Console.WriteLine("  ");
        Console.WriteLine("  Press Ctrl+C or close this window to stop.");
        Console.WriteLine("  ════════════════════════════════════════════");
        Console.ResetColor();

        while (true)
        {
            Thread.Sleep(1000);
            if (backendProc != null && backendProc.HasExited)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n  ⚠ Backend process exited unexpectedly.");
                Console.ResetColor();
                break;
            }
            if (frontendProc != null && frontendProc.HasExited)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n  ⚠ Frontend process exited unexpectedly.");
                Console.ResetColor();
                break;
            }
        }

        Shutdown();
        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

    static Process StartProcess(string exe, string arguments, string workDir)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = exe,
                Arguments = arguments,
                WorkingDirectory = workDir,
                UseShellExecute = false,
                CreateNoWindow = false,
            };
            return Process.Start(psi);
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("  ✗ Failed to start: " + ex.Message);
            Console.ResetColor();
            return null;
        }
    }

    static string FindExecutable(string name)
    {
        string[] searchPaths = new string[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", name),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", name),
        };

        foreach (var p in searchPaths)
        {
            if (File.Exists(p)) return p;
        }

        try
        {
            var proc = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "where.exe",
                    Arguments = name,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };
            proc.Start();
            string output = proc.StandardOutput.ReadLine();
            proc.WaitForExit();
            if (!string.IsNullOrEmpty(output) && File.Exists(output.Trim()))
                return output.Trim();
        }
        catch { }

        return null;
    }

    static void Shutdown()
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("\n  Shutting down...");
        Console.ResetColor();

        try { if (backendProc != null && !backendProc.HasExited) { backendProc.Kill(); } } catch { }
        try { if (frontendProc != null && !frontendProc.HasExited) { frontendProc.Kill(); } } catch { }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("  ✓ All processes stopped.");
        Console.ResetColor();
    }
}
