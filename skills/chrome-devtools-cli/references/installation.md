# Installation

Install `@chenpx976/chrome-devtools-mcp` globally to make the `chrome-devtools`
command available. Both the MCP and CLI binaries ship in this package; do not
install the separate official `chrome-devtools` alias package.

The scoped package is not yet published or verified. Until its first release
is verified, build the fork locally using its `docs/arc.md` instructions.
Do not substitute official npm for an Arc connection.

```sh
npm i @chenpx976/chrome-devtools-mcp@latest -g
chrome-devtools status # check if install worked.
```

Verify the installed package name/version and that the executable on `PATH`
belongs to this scoped package. The `chrome-devtools` command name is unchanged,
so its presence alone does not distinguish this fork from an official install.

## Troubleshooting

- **Command not found:** If `chrome-devtools` is not recognized, ensure your global npm `bin` directory is in your system's `PATH`. Restart your terminal or source your shell configuration file (e.g., `.bashrc`, `.zshrc`).
- **Permission errors:** If you encounter `EACCES` or permission errors during installation, avoid using `sudo`. Instead, use a node version manager like `nvm`, or configure npm to use a different global directory.
- **Old version running:** Stop the existing daemon with `chrome-devtools stop`, then update `@chenpx976/chrome-devtools-mcp`. Inspect the executable path and installed package version before restarting. If an official installation owns the same binary names, remove that conflicting installation before installing the scoped package.
