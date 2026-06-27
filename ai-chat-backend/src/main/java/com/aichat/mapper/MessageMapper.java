package com.aichat.mapper;

import com.aichat.entity.Message;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
    @Select("SELECT * FROM message WHERE conversation_id = #{conversationId} AND role = 'user' AND created_at < (SELECT created_at FROM message WHERE id = #{messageId}) ORDER BY created_at DESC LIMIT 1")
    Message getPreviousUserMessage(@Param("conversationId") Long conversationId, @Param("messageId") Long messageId);
}
