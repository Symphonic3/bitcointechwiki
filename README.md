# bitcointech.wiki

A modern resource for bitcoin information, and a second-generation, visual transaction editor

[![Bitcointech.wiki | A New Bitcoin Transaction Editor | By Symphonic](http://img.youtube.com/vi/YIXhf_eciA4/0.jpg)](http://www.youtube.com/watch?v=YIXhf_eciA4 "Bitcointech.wiki | A New Bitcoin Transaction Editor | By Symphonic")

# Use trustlessly

In order to use this tool trustlessly and securely, you need to download at a minimum editor.html and sketch.js from the project files.

~~You should also download the latest version of the mempoolJS API and reference that directly in editor.html, instead of fetching it from their servers as it is currently.~~
*We have removed the remote mempool.js api reference as they have stopped updating it. It is now referenced directly from the lib folder, with our own edited copy. Convenient!

You can then edit the chainparams array in sketch.js to point to your self-hosted [mempool.space](https://github.com/mempool/mempool) instance, which should be connected to your own node.

This can also be done to allow the tool to be used with a regtest chain, but you will need to configure mempool.space to point to that chain, and the chainparams will likely be different.

# License

This software is distributed under the GNU AGPLv3 license. For more information, see [LICENSE](LICENSE)
