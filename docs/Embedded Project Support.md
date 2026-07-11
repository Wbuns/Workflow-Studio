# Workflow Studio Embedded Project Support

**Version:** 1.0  
**Status:** Active foundation  
**Introduced:** v1.3

## Purpose

Workflow Studio recognizes embedded-device workspaces without coupling the core analyzer to a specific product. The first implementation supports PlatformIO-style projects and ESP32-family detection.

## Detection

Embedded analysis uses workspace evidence such as `platformio.ini`, firmware entry points, and the `firmware/`, `include/`, `lib/`, and `boards/` folders. PlatformIO environments provide board, platform, and framework details.

## Optional metadata

`.workflowstudio/project.json` may define `targetPlatform`, `boardIdentifier`, `framework`, `firmwareSourcePath`, `uploadCommand`, `serialMonitorCommand`, `cleanCommand`, `deviceProfile`, and `hardwareConstraints`. These fields remain optional for backward compatibility.

Product-specific context belongs in metadata or a reusable device profile. Generic embedded services must not hardcode Orivex Display, Orivex Token, Wall Dock, or future device assumptions.

## Read-only commands

The Dashboard may show detected PlatformIO build, upload, monitor, and clean commands. v1.3 does not execute firmware flashing or serial-port operations.

## Health checks

Initial checks cover PlatformIO configuration, firmware entry point, board environment, board identifier, documentation, hardware specifications, and accidentally tracked generated output.
