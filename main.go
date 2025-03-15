package main

import (
	"embed"
	"fmt"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"

	"echohush/internal/db"
	"echohush/pkg/daemon"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed README.md
var readme embed.FS

//go:embed internal/db/sql/schema.sql
var schema embed.FS

func main() {
	daemon.SetGlobalFS(
		daemon.FSPair{Key: "readme", FS: readme},
		daemon.FSPair{Key: "schema", FS: schema},
		daemon.FSPair{Key: "assets", FS: assets},
	)

	fmt.Println(daemon.VsersionLong())
	// Create an instance of the app structure
	app := NewApp()
	query := &db.FrontQuery{Q: db.NewQuery()}
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "EchoHush",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: options.NewRGBA(0, 255, 0, 255),
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			query,
		},
		Linux: &linux.Options{
			WebviewGpuPolicy: linux.WebviewGpuPolicyAlways,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
