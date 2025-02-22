package main

import (
	"embed"
	"fmt"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"echohush/internal/db"
	"echohush/pkg/daemon"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	fmt.Println(daemon.VsersionLong())
	// Create an instance of the app structure
	app := NewApp()
	query := &db.FrontQuery{Q: db.NewQuery()}
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "echohush",
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
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
