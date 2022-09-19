# Oregano

A game written in C for the [WASM-4](https://wasm4.org) fantasy console.

## Building

Download WASI SDK:

```shell
export WASI_VERSION=16
export WASI_VERSION_FULL=${WASI_VERSION}.0
wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}/wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
tar xvf wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
```

Run the game, rebuilding automatically when source files are changed, by running:

```shell
# Point it to the extracted folder
export WASI_SDK_PATH=~/Downloads/wasi-sdk-16.0/
# This will open up http://localhost:4444 in your browser unless you pass --no-open
w4 watch
```

For more info about setting up WASM-4, see the [quickstart guide](https://wasm4.org/docs/getting-started/setup?code-lang=c#quickstart).

## Links

- [Documentation](https://wasm4.org/docs): Learn more about WASM-4.
- [Snake Tutorial](https://wasm4.org/docs/tutorials/snake/goal): Learn how to build a complete game
  with a step-by-step tutorial.
- [WASM-4 on GitHub](https://github.com/aduros/wasm4): Submit an issue or PR. Contributions are welcome!
