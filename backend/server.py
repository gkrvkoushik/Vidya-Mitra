from fastapi import FastAPI
import uvicorn,json
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def base():
    return {"Port 3000":"Server is running..........."}

#add routes



if __name__=="__main__":
    uvicorn.run(app,host="127.0.0.1",port=3000)