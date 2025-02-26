package daemon

import (
	"fmt"
	"strings"

	"echohush/pkg/path"

	"github.com/spf13/viper"
)

// 注意尽量用一个单词，经过测试后用两个单词无法解析配置文件。
type ApiOption struct {
	Log           Log
	Server        Server
	OpenAI        OpenAI `mapstructure:"openai"`
	Database      DatabaseOption
	EmailAccounts map[string]Email `mapstructure:"email"`
}

type OpenAI struct {
	AuthKey  string `mapstructure:"auth"`
	Endpoint string `mapstructure:"endpoint"`
	Model    string `mapstructure:"model"`
}

type Email struct {
	Name     string
	From     string
	Server   string
	Port     int
	Password string
	BCC      []string
}

type DatabaseOption struct {
	User     string
	Type     string
	Password string
	Name     string
	Path     string //support sqlite
	Host     string
	Port     int
}

var (
	globalApiOption *ApiOption = nil
)

func SetGlobalApiOption(opt *ApiOption) {
	if globalApiOption != nil { //init once
		return
	}
	globalApiOption = opt
}

func G() *ApiOption {
	return globalApiOption
}

func Env() string {
	return ENV
}

func IsProduction() bool {
	return ENV == "production"
}

func IsDev() bool {
	return ENV == "dev"
}

func ParseConfig(configFile string, opt interface{}) error {
	v := viper.New()

	v.AutomaticEnv()
	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))

	v.SetConfigType("toml")
	if configFile != "" {
		if !path.PathIsExist(configFile) {
			return fmt.Errorf("%s is not exist", configFile)
		}
		v.SetConfigFile(configFile)
	}
	err := v.ReadInConfig()
	if err != nil {
		return nil
	}

	return v.Unmarshal(opt)
}

type Log struct {
	Path  string
	Debug bool
}

type Server struct {
	Listen         string
	Port           int
	InternalListen string `mapstructure:"internal_listen"`
	InternalPort   int    `mapstructure:"internal_port"`
	ViteURL        string `mapstructure:"vite_url"`
	Env            string
}

func (s Server) ListenString() string {
	return fmt.Sprintf("%s:%d", s.Listen, s.Port)
}

func (s Server) InternalHosting() string {
	if s.InternalPort == 0 {
		s.InternalPort = 10000
	}

	return fmt.Sprintf("127.0.0.1:%d", s.InternalPort)
}

func (s Server) InternalListingString() string {
	if s.InternalPort == 0 {
		s.InternalPort = 10000
	}
	if s.InternalListen == "" {
		s.InternalListen = "127.0.0.1"
	}
	return fmt.Sprintf("http://%s:%d", s.InternalListen, s.InternalPort)
}

// DBString dbType is "mysql", "pg", "sqlite"
func (o DatabaseOption) DBString() string {
	switch o.Type {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			o.User, o.Password, o.Host,
			o.Port, o.Name)
	case "sqlite", "sqlite3":
		return fmt.Sprintf("%s", o.Path)
	case "postgres":
		return fmt.Sprintf("postgres://%s:%s@%s:%d/%s", o.User, o.Password,
			o.Host, o.Port, o.Name)
	}
	panic("your fucking code will waste two hours to debug")
}
