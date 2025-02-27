package main

import (
	"context"
	"log"

	goruntime "runtime"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"echohush/pkg/daemon"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) ChooseFilePath() string {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Diary File",
		Filters: []runtime.FileFilter{
			{DisplayName: "Text Files (*.db)", Pattern: "*.db"},
		},
	})
	if err != nil {
		log.Println("Error getting file path:", err)
		return ""
	}
	a.SetDBPath(filePath)
	return filePath
}

func (a *App) Platform() string {
	//windows, darwin, linux
	return goruntime.GOOS
}

func (a *App) GetDBPath() string {
	return daemon.GetDBPath()
}

func (a *App) SetDBPath(dbPath string) {
	daemon.SetDBPath(dbPath)
}

func (a *App) IsDev() bool {
	return daemon.IsDev()
}
