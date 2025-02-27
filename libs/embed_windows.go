//go:build windows
// +build windows

package libs

import "embed"

//go:embed libsimple.dll
var Simple embed.FS
