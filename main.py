import  pandas as pd
df1 =pd.read_csv("titanic.csv")
print(df1)
#print(df1.shape)
print(df1.columns)
print(df1.isnull().sum())