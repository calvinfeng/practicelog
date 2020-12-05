package logstore

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/log"
)

func ByID(id string) log.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["id"] = id
	}
}

func ByLabelIDs(ids []string) log.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["label_id"] = ids
	}
}
