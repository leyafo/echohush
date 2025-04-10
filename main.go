package main

import (
	"embed"
	"fmt"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"

	"context"

	"echohush/internal/db"
	"echohush/pkg/daemon"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed README.md
var readme embed.FS

//go:embed internal/db/sql/schema.sql
var schema embed.FS

//go:embed build/appicon.png
var icon []byte

const appName = "EchoHush"

var version = "0.0.0"

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
		OnShutdown: func(ctx context.Context) {
			query.Q.CloseDB()
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			About: &mac.AboutInfo{
				Title:   fmt.Sprintf("%s %s", appName, version),
				Message: "A modern lightweight cross-platform Redis desktop client.\n\nCopyright © 2025",
				Icon:    icon,
			},
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableFramelessWindowDecorations: false,
		},
		Linux: &linux.Options{
			ProgramName:         appName,
			Icon:                icon,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyOnDemand,
			WindowIsTranslucent: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
