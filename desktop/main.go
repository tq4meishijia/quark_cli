// Command kuake-desktop 是夸克网盘的桌面端 GUI 客户端。
//
// 它不实现任何网盘协议：所有网络与文件操作都通过 app 包转发到
// github.com/zhangjingwei/kuake_cli/sdk，与 CLI 共用同一套能力。
package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"kuake-desktop/app"
)

//go:embed all:frontend
var assets embed.FS

func main() {
	application := app.New()

	err := wails.Run(&options.App{
		Title:     "夸克网盘桌面版",
		Width:     1240,
		Height:    800,
		MinWidth:  900,
		MinHeight: 600,
		// 窗口底色与暗色主题一致，避免启动时闪一下白屏。
		BackgroundColour: &options.RGBA{R: 15, G: 17, B: 21, A: 1},
		AssetServer:      &assetserver.Options{Assets: assets},
		OnStartup:        application.Startup,
		OnDomReady:       application.DomReady,
		OnShutdown:       application.Shutdown,
		Bind:             []interface{}{application},
	})
	if err != nil {
		log.Fatal(err)
	}
}
