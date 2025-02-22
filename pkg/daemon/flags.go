package daemon

import (
	"os"

	"github.com/spf13/pflag"
)

type Flags struct {
	ConfigFile   string
	PrintVersion bool
	flags        *pflag.FlagSet
}

func ParseFlags() (*Flags, error) {
	opt := &Flags{
		flags: pflag.NewFlagSet(os.Args[0], pflag.ContinueOnError),
	}

	opt.PrintVersion = false
	opt.flags.StringVarP(&opt.ConfigFile, "config", "f", "", "load the config file name")
	opt.flags.BoolVarP(&opt.PrintVersion, "version", "v", false, "print version")
	err := opt.flags.Parse(os.Args[1:])
	if err != nil {
		return nil, err
	}
	return opt, nil
}
