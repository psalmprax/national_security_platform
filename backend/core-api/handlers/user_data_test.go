package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExportUserData_Unauthorized(t *testing.T) {
	h := &Handler{}
	req, _ := http.NewRequest("GET", "/api/v1/user/export", nil)
	rr := httptest.NewRecorder()

	h.ExportUserData(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestDeleteUserAccount_Unauthorized(t *testing.T) {
	h := &Handler{}
	req, _ := http.NewRequest("DELETE", "/api/v1/user/delete", nil)
	rr := httptest.NewRecorder()

	h.DeleteUserAccount(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestExportUserData_InvalidID(t *testing.T) {
	h := &Handler{}
	req, _ := http.NewRequest("GET", "/api/v1/user/export", nil)
	req.Header.Set("X-User-ID", "invalid-uuid")
	rr := httptest.NewRecorder()

	h.ExportUserData(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
}
