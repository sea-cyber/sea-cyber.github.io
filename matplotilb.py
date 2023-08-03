import matplotlib.pyplot as plt
num_people, categories = [9,7,3,3,2,2,2,2,2,2,2,1,1,1,1,1,1], ["Nanjing Agricultural University ","Nanjing Normal University ", "Yangzhou University", "China University of Mining and Technology ", "Southeast University" ,"Jiangsu Normal University","Suzhou University of Science and Technology","Jiangsu University","Nanjing University of Technology","Nanjing University of Finance and Economics ","Hohai University","Xuzhou Institute of Technology","Jiangsu Ocean University","Jiangsu University of Science and Technology ","Anhui University of Science and Technology","Nanjing Forestry University","Suqian College"]
plt.bar(categories, num_people)
plt.title("CUHK Jiangsu Summer", fontsize=24)
plt.xlabel("University", fontsize=16)
plt.ylabel("# of people", fontsize=16)
plt.xticks(fontname="Fantasy")
plt.yticks(fontname="Fantasy")
plt.show()