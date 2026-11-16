#!/usr/bin/env python
"""
Start script for the Spotifake Spring Boot Backend Service.
Runs the Spring Boot backend on http://127.0.0.1:8000
"""
import os
import shutil
import subprocess
import sys


def resolve_java():
    portable_java = os.path.join(os.path.expanduser("~"), ".tools", "jdk", "jdk21.0.12_12", "bin", "java.exe")
    if os.path.isfile(portable_java):
        return portable_java
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        candidate = os.path.join(java_home, "bin", "java.exe" if os.name == "nt" else "java")
        if os.path.isfile(candidate):
            return candidate
    return shutil.which("java")


if __name__ == "__main__":
    repo_root = os.path.dirname(os.path.abspath(__file__))
    backend_spring_dir = os.path.join(repo_root, "BackendSpringBoot")
    jar_path = os.path.join(backend_spring_dir, "target", "spotifake-backend-2.0.0.jar")

    print("====================================================")
    print("  Starting Spotifake Spring Boot Backend (port 8000)...")
    print("====================================================")

    try:
        if not os.path.isfile(jar_path):
            mvn_cmd = os.path.join(backend_spring_dir, "run_mvn.cmd")
            subprocess.run(["cmd.exe", "/c", mvn_cmd, "package", "-DskipTests"], cwd=backend_spring_dir, check=True)

        java_exe = resolve_java()
        if not java_exe:
            raise RuntimeError("Java 21 runtime not found in ~/.tools/jdk, JAVA_HOME, or PATH.")

        subprocess.run([java_exe, "-jar", jar_path], cwd=backend_spring_dir, check=True)
    except KeyboardInterrupt:
        print("\nBackend stopped.")
    except Exception as e:
        print(f"Error starting Spring Boot backend: {e}")
        sys.exit(1)
