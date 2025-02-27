//go:build darwin
// +build darwin

package libs

import "embed"

//go:embed libsimple.dylib
var Simple embed.FS
