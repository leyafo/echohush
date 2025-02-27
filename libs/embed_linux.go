//go:build linux
// +build linux

package libs

import "embed"

//go:embed libsimple.so
var Simple embed.FS
