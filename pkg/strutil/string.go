package strutil

import (
	"encoding/json"
	"io"
	"strings"
	"unicode"

	"crypto/rand"
)

func InsensitiveCmp(str1, str2 string) bool {
	return strings.ToLower(str1) == strings.ToLower(str2)
}

func ToCamelCase(str string) string {
	var (
		sb      strings.Builder
		toUpper bool = true
	)
	for i := 0; i < len(str); i++ {
		//skip the character if it is not a letter
		if unicode.IsSymbol(rune(str[i])) || str[i] == '_' || str[i] == '-' || str[i] == ' ' {
			toUpper = true
			continue
		}
		if toUpper {
			sb.WriteRune(unicode.ToUpper(rune(str[i])))
			toUpper = false
		} else {
			sb.WriteByte(str[i])
		}
	}
	return sb.String()
}

func ReadReader(r io.Reader) string {
	buf := new(strings.Builder)
	io.Copy(buf, r)
	return buf.String()
}

func RandStr(length int) string {
	seed := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, seed); err != nil {
		return ""
	}
	return string(seed)
}

func ToJsonString(v any) string {
	d, _ := json.Marshal(v)
	return string(d)
}

func FromJsonString(jsonStr string, v any) error {
	return json.Unmarshal([]byte(jsonStr), &v)
}
