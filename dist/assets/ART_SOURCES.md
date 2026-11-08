# v8.3 食物素材

- 使用内置 image_gen 生成，属于拟真食物插画素材，不是实拍。
- 项目文件：food-atlas-v2.jpg，16格，CSS定位呈现，不依赖远程服务。
- 本次使用的提示词集：ONE 4x4 food sprite atlas, 16 equal square cells. Editorial realistic food photography on a warm ivory background. No text, labels, characters or borders. Row-major order: red-bean double-skin milk pudding; purple taro yogurt bowl with blueberries; matcha layered cake; fruit pancakes with strawberries and cream; beef noodle soup; egg fried rice; chicken with rice and greens; egg vegetable sandwich; xiaolongbao; boiled dumplings; copper hotpot with beef, tofu and greens; burger and fries; oat porridge; steamed corn; roasted sweet potato; glass of soy milk with boiled egg. Consistent camera angle and soft studio lighting, clear individual food details, food centered with comfortable margins.

校园地图为代码绘制，路网根据用户提供的参考图简化。遗产地标以苏州大学官方资料核对名称；新增实验室、球场、花园等设施作游戏功能点安排，不声称对应真实楼宇坐标。


## v8.4 当前餐食画面

当前界面使用 canteen-ui.js 中的原生SVG卡通插画，覆盖全部菜单，不再使用上面的拟真图集。图集保留仅供版本资料追溯，已从单文件导出的资源表移除。

## 早期背景音乐试作（已停用）

- 文件 `bgm-campus.wav`，100 BPM、16 小节、38.4 秒；24 kHz、16 位立体声。
- 使用代码原创编排并合成中音区短拨弦和有节奏的大三和弦，采用 C–F–G–C 的明亮和声。旋律在 C4–E5，低音不低于 C3，无人声、采样或第三方曲目。旋律与和声写在 `scripts/generate-campus-music.py`，运行脚本需要 Python 和 NumPy。
- 短尾音按环形音轨渲染，释放时间最多 0.22 秒，无持续铺底、失谐、深低音或长混响。峰值 0.55，播放音量为 0.22，可由界面独立关闭。


## 当前校园背景音乐

'Simplicity' by Scott Buckley — released under CC-BY 4.0. www.scottbuckley.com.au 。作者曲目页：https://www.scottbuckley.com.au/library/simplicity/ 。许可证：https://creativecommons.org/licenses/by/4.0/ 。使用原始 MP3，游戏中低音量循环播放。完整来源与校验记录见 THIRD_PARTY_NOTICES.md。
