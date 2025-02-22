package thirdparty

import (
	"context"

	"echohush/pkg/daemon"

	openai "github.com/sashabaranov/go-openai"
)

func NewOpenAIClient() *openai.Client {
	openaiCfg := openai.DefaultConfig(daemon.G().OpenAI.AuthKey)
	openaiCfg.BaseURL = daemon.G().OpenAI.Endpoint
	client := openai.NewClientWithConfig(openaiCfg)
	return client
}

func CompletingMessage(client *openai.Client, content string) (string, error) {
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: content,
				},
			},
		},
	)

	if err != nil {
		return "", err
	}
	return resp.Choices[0].Message.Content, nil
}
