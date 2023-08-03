import pandas as pd
raw_data = pd.read_csv("titanic.csv")
#print(raw_data.head())#.head()默认读取前五行数据 size=5
#print(raw_data.shape)
#print(len(raw_data))
print(raw_data.columns)
print(raw_data['Survived'])
print(sum(raw_data['Survived']))