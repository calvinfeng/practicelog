package store

import (
	"github.com/Masterminds/squirrel"
	"github.com/calvinfeng/practicelog/practicelog"
)

func ByID(id string) practicelog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["id"] = id
	}
}

func ByLabelIDList(ids []string) practicelog.SQLFilter {
	return func(eq squirrel.Eq) {
		eq["label_id"] = ids
	}
}
