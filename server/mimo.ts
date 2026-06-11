import fs from 'fs';
import path from 'path';

export interface MimoConfig {
    /** MiMo API Key，必填 */
    apiKey: string;
    /** 可选，默认 https://api.xiaomimimo.com/v1 */
    baseURL?: string;
    /** 可选，默认 mimo-v2-omni（多模态模型） */
    model?: string;
}

export interface Point {
    x: number;
    y: number;
}

/**
 * 小米 MiMo API 客户端封装
 * 基于 OpenAI 兼容接口，支持视觉理解与元素定位
 */
export class MimoClient {
    private apiKey: string;
    private baseURL: string;
    private model: string;

    constructor(config: MimoConfig) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || 'https://api.xiaomimimo.com/v1';
        this.model = config.model || 'mimo-v2-omni';
    }

    /**
     * 识别图片中单个 UI 元素的位置
     * @param image 图片文件路径或 Buffer
     * @param description 元素描述，例如："发送按钮"、"图片生成按钮"、"右上角设置图标"
     * @returns 元素中心点坐标 { x, y }，以图片左上角为原点
     */
    async locateElement(image: string | Buffer, description: string): Promise<Point> {
        const points = await this.locateElements(image, [description]);
        return points[0];
    }

    /**
     * 批量识别图片中多个 UI 元素的位置
     * @param image 图片文件路径或 Buffer
     * @param descriptions 元素描述数组，例如：["发送按钮", "图片生成按钮"]
     * @returns 坐标数组，顺序与传入的 descriptions 一致
     */
    async locateElements(image: string | Buffer, descriptions: string[]): Promise<Point[]> {
        if (descriptions.length === 0) {
            return [];
        }

        const imageBase64 = Buffer.isBuffer(image)
            ? image.toString('base64')
            : fs.readFileSync(image).toString('base64');

        const mimeType = Buffer.isBuffer(image) ? 'image/png' : this.getMimeType(image);

        const items = descriptions.map((d, i) => `${i + 1}. "${d}"`).join('\n');

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            // MiMo-VL 要求视觉输入必须放在文本之前
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                            {
                                type: 'text',
                                text: `请在图片中按顺序找到以下 ${descriptions.length} 个元素，并返回它们中心点的坐标数组。坐标系以图片左上角为原点(0,0)，横向向右为x轴正方向，纵向向下为y轴正方向。\n\n${items}\n\n只返回JSON数组格式，顺序与上面列表严格一致，不要包含任何其他解释：[{"x": number, "y": number}, ...]`,
                            },
                        ],
                    },
                ],
                max_tokens: 1024,
                temperature: 0.2,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MiMo API error: ${response.status} ${errorText}`);
        }

        const data = (await response.json()) as any;
        const content: string = data.choices?.[0]?.message?.content || '';

        // 尝试从响应内容中提取 JSON 数组
        const jsonMatch = content.match(/\[[\s\S]*?\]/);
        if (!jsonMatch) {
            throw new Error(`无法从 MiMo 响应中解析坐标数组: ${content}`);
        }

        const points = JSON.parse(jsonMatch[0]) as Point[];
        if (!Array.isArray(points) || points.length !== descriptions.length) {
            throw new Error(`返回的坐标数组长度不正确，期望 ${descriptions.length} 个，实际 ${points.length} 个: ${content}`);
        }

        points.forEach((p, i) => {
            if (typeof p.x !== 'number' || typeof p.y !== 'number') {
                throw new Error(`第 ${i + 1} 个坐标格式不正确: ${content}`);
            }
        });

        return points;
    }

    private getMimeType(imagePath: string): string {
        const ext = path.extname(imagePath).toLowerCase();
        switch (ext) {
            case '.png':
                return 'image/png';
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.webp':
                return 'image/webp';
            case '.gif':
                return 'image/gif';
            default:
                return 'image/png';
        }
    }
}
