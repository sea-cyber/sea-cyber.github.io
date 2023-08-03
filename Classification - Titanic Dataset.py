import pandas as pd
data = pd.read_csv("preprocessed_data.csv")
data = data.drop("Unnamed: 0", 1)
X = data.drop(["Survived"], axis=1)
y = data["Survived"]
X.columns