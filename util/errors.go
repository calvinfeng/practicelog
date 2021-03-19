package util

import (
	"strings"
)

type ErrorList []string

func (e ErrorList) Error() string {
	return strings.Join(e, ",")
}

func ConcatErrors(errorList ...error) error {
	messages := make([]string, 0, len(errorList))
	for i := 0; i < len(errorList); i++ {
		if errorList[i] != nil {
			messages = append(messages, errorList[i].Error())
		}
	}
	if len(messages) == 0 {
		return nil
	}
	return ErrorList(messages)
}
