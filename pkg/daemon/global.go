package daemon

import (
	"embed"
	"errors"
)

var (
	globalMapFS = make(map[string]embed.FS)
)

type FSPair struct {
	Key string
	FS  embed.FS
}

func SetGlobalFS(pairs ...FSPair) {
	for _, fsp := range pairs {
		globalMapFS[fsp.Key] = fsp.FS
	}
}

func GetGlobalFSContent(key, fname string) ([]byte, error) {
	fs, ok := globalMapFS[key]
	if !ok {
		return nil, errors.New("no such embeded file")
	}
	return fs.ReadFile(fname)
}
