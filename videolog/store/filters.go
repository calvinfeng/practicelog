package store

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/videolog"
)

func IsMonthlyProgress(val bool) videolog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["is_monthly_progress"] = val
	}
}
