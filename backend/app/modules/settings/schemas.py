from pydantic import BaseModel


class BankDetailsRequest(BaseModel):
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str | None = None
    upi_id: str | None = None


class BankDetailsResponse(BaseModel):
    id: str
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str | None
    upi_id: str | None

    model_config = {"from_attributes": True}
