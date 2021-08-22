package restapi

import "github.com/google/uuid"

type IDResponse struct {
	ID uuid.UUID `json:"id"`
}
