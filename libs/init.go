package libs

import (
	"runtime"
)

func GetSimpleLibraryName() string {
	switch runtime.GOOS {
	case "windows":
		return "libsimple.dll"
	case "linux":
		return "libsimple.so"
	case "darwin":
		return "libsimple.dylib"
	}
	panic("unsupport platform")
}
