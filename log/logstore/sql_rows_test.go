package logstore

import (
	"testing"
	"time"

	"github.com/calvinfeng/practicelog/log"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLogEntryConversion(t *testing.T) {
	entry := &log.Entry{
		ID:       uuid.New(),
		UserID:   "calvin.j.feng@gmail.com",
		Date:     time.Now(),
		Duration: 90,
		Message:  "Example",
		Details:  "Example 1234",
		Assignments: []*log.Assignment{
			{
				Position:  0,
				Name:      "Do A",
				Completed: false,
			},
			{
				Position:  1,
				Name:      "Do B",
				Completed: false,
			},
			{
				Position:  2,
				Name:      "Do C",
				Completed: false,
			},
		},
		Labels: nil,
	}

	row := new(logEntryRow).fromModel(entry)
	assert.NotNil(t, row.Assignments)
	assert.NotEmpty(t, row.Assignments)

	model := row.toModel()
	assert.NotNil(t, model.Assignments)
	assert.NotEmpty(t, model.Assignments)
	require.Len(t, model.Assignments, 3)
	assert.Equal(t, entry.Assignments[0], model.Assignments[0])
	assert.Equal(t, entry.Assignments[1], model.Assignments[1])
	assert.Equal(t, entry.Assignments[2], model.Assignments[2])
}
