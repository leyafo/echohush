package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"os"
	"path"
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

func (a *App) getConfigDir() string {
	var (
		homedir string
		err     error
	)
	if daemon.IsDev() {
		homedir, err = os.Getwd()
	} else {
		homedir, err = os.UserHomeDir()
	}
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}
	return homedir
}

func (a *App) GetDBPath() string {
	configPath := path.Join(a.getConfigDir(), ".echohush")
	content, err := os.ReadFile(configPath)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}

	return strings.TrimSpace(string(content))
}

func (a *App) SetDBPath(dbPath string) {
	configPath := path.Join(a.getConfigDir(), ".echohush")
	os.WriteFile(configPath, []byte(dbPath), 0644)
}

func (a *App) IsDev() bool {
	return daemon.IsDev()
}
